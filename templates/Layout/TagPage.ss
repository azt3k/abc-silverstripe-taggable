
<div class="typography">

	<div class="content-area">

	  	<% include BreadCrumbs %>

	  	<div class="hits-selector">$HitsSelector</div>

		<h2>Tagged with &quot;$TagStr&quot;</h2>

		<div class="main-content-wrap">
			<div class="main-content-left">
				
				<% control TagSet %>
				
					<div class="list-item">
						<h3 class="item-title"><a href="$Link">$Title</a></h3>
						<div class="item-body">
							<% if AssociatedImage %>
								<div class="item-image"><img src="$AssociatedImage.resizedCroppedAbsoluteURL(140,105)" /></div>
							<% end_if %>
							<div class="item-content">
								<div class="item-description">$LimitedDescription</div>
								<div class="item-read-more"><a href="$Link">Read More</a></div>
								<% if Tags %><div class="item-tags">Associated Tags: $tagURLStr</div><% end_if %>
								<div class="clear"></div>
							</div>
							<div class="clear"></div>
						</div>
					</div>
				
				<% end_control %>
				
				<% include Pagination %>
				
			</div>
			<div class="main-content-right">

				<% include RightColumn %>

			</div>
			<div class="clear"></div>

		</div>
	</div>

</div>